import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accountId } = await req.json();

    if (!accountId) {
      return Response.json({ error: 'Account ID is required' }, { status: 400 });
    }

    const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
    if (!YOUTUBE_API_KEY) {
      return Response.json({ error: 'YouTube API key not configured' }, { status: 500 });
    }

    // Get the social media account
    const account = await base44.entities.SocialMediaAccount.get(accountId);

    if (!account || account.platform !== 'YouTube') {
      return Response.json({ error: 'Invalid YouTube account' }, { status: 404 });
    }

    // Extract channel ID from URL or use account_id
    let channelId = account.account_id;
    if (!channelId && account.account_url) {
      const match = account.account_url.match(/channel\/([^\/\?]+)/);
      if (match) channelId = match[1];
    }

    if (!channelId) {
      return Response.json({ error: 'Channel ID not found. Please update account settings.' }, { status: 400 });
    }

    // Fetch channel statistics
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`
    );
    const channelData = await channelResponse.json();

    if (!channelData.items || channelData.items.length === 0) {
      return Response.json({ error: 'Channel not found' }, { status: 404 });
    }

    const stats = channelData.items[0].statistics;
    const subscriberCount = parseInt(stats.subscriberCount) || 0;
    const viewCount = parseInt(stats.viewCount) || 0;
    const videoCount = parseInt(stats.videoCount) || 0;

    // Fetch recent videos for engagement metrics
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=20&key=${YOUTUBE_API_KEY}`
    );
    const videosData = await videosResponse.json();

    let totalLikes = 0;
    let totalComments = 0;
    let totalViews = 0;
    let topVideo = null;
    let maxViews = 0;

    if (videosData.items) {
      const videoIds = videosData.items
        .filter(item => item.id.videoId)
        .map(item => item.id.videoId)
        .slice(0, 10);

      if (videoIds.length > 0) {
        const videoStatsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`
        );
        const videoStatsData = await videoStatsResponse.json();

        videoStatsData.items?.forEach(video => {
          const likes = parseInt(video.statistics.likeCount) || 0;
          const comments = parseInt(video.statistics.commentCount) || 0;
          const views = parseInt(video.statistics.viewCount) || 0;

          totalLikes += likes;
          totalComments += comments;
          totalViews += views;

          if (views > maxViews) {
            maxViews = views;
            topVideo = {
              url: `https://www.youtube.com/watch?v=${video.id}`,
              type: 'video'
            };
          }
        });
      }
    }

    // Calculate engagement rate
    const avgViewsPerVideo = videoCount > 0 ? totalViews / Math.min(videoCount, 10) : 0;
    const engagementRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;

    // Get previous metrics to calculate changes
    const previousMetrics = await base44.entities.SocialMetric.filter(
      { account_id: accountId, platform: 'YouTube' },
      '-date',
      1
    );

    const previousSubscribers = previousMetrics[0]?.followers_gained || subscriberCount;
    const netSubscriberChange = subscriberCount - previousSubscribers;

    // Calculate health score
    const healthScore = Math.min(100, Math.round(
      (engagementRate * 0.3) +
      (avgViewsPerVideo > 1000 ? 30 : (avgViewsPerVideo / 1000) * 30) +
      (netSubscriberChange > 0 ? 20 : 0) +
      (totalViews > 10000 ? 20 : (totalViews / 10000) * 20)
    ));

    const healthStatus = healthScore >= 70 ? 'Growing' : healthScore >= 50 ? 'Stable' : 'Needs Attention';

    // Generate insight
    const insight = `Channel has ${subscriberCount.toLocaleString()} subscribers with ${engagementRate.toFixed(2)}% engagement rate. ${netSubscriberChange > 0 ? `Gained ${netSubscriberChange} subscribers` : 'Subscriber growth stable'} this period.`;

    // Store metrics
    const metricData = {
      client_id: account.client_id,
      account_id: accountId,
      platform: 'YouTube',
      date: new Date().toISOString().split('T')[0],
      reach: totalViews,
      engagement_rate: engagementRate,
      followers_gained: subscriberCount,
      followers_lost: 0,
      net_follower_change: netSubscriberChange,
      link_clicks: 0,
      profile_visits: 0,
      saves: 0,
      shares: 0,
      comments: totalComments,
      likes: totalLikes,
      impressions: totalViews,
      watch_time_minutes: 0,
      avg_watch_percentage: 0,
      top_post_reach: maxViews,
      top_post_url: topVideo?.url,
      top_post_type: 'video',
      health_score: healthScore,
      health_status: healthStatus,
      insight_text: insight
    };

    await base44.entities.SocialMetric.create(metricData);

    // Update last sync time
    await base44.entities.SocialMediaAccount.update(accountId, {
      last_sync: new Date().toISOString(),
      connection_status: 'Connected'
    });

    return Response.json({ 
      success: true, 
      metrics: metricData 
    });

  } catch (error) {
    console.error('Error syncing YouTube metrics:', error);
    return Response.json({ 
      error: error.message || 'Failed to sync YouTube metrics'
    }, { status: 500 });
  }
});