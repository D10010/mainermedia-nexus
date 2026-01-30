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

    // Get the social media account
    const account = await base44.entities.SocialMediaAccount.get(accountId);

    if (!account || account.platform !== 'TikTok') {
      return Response.json({ error: 'Invalid TikTok account' }, { status: 404 });
    }

    if (!account.access_token) {
      return Response.json({ error: 'No access token found. Please reconnect this account.' }, { status: 400 });
    }

    // Fetch user info
    const userInfoResponse = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=follower_count,following_count,likes_count,video_count',
      {
        headers: {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const userInfo = await userInfoResponse.json();

    if (userInfo.error) {
      return Response.json({ error: userInfo.error.message }, { status: 400 });
    }

    const followerCount = userInfo.data?.user?.follower_count || 0;
    const likesCount = userInfo.data?.user?.likes_count || 0;
    const videoCount = userInfo.data?.user?.video_count || 0;

    // Fetch video list
    const videosResponse = await fetch(
      'https://open.tiktokapis.com/v2/video/list/?fields=id,create_time,share_count,view_count,like_count,comment_count,share_url&max_count=20',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const videosData = await videosResponse.json();

    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let topVideo = null;
    let maxViews = 0;

    if (videosData.data?.videos) {
      videosData.data.videos.forEach(video => {
        const views = video.view_count || 0;
        const likes = video.like_count || 0;
        const comments = video.comment_count || 0;
        const shares = video.share_count || 0;

        totalViews += views;
        totalLikes += likes;
        totalComments += comments;
        totalShares += shares;

        if (views > maxViews) {
          maxViews = views;
          topVideo = {
            url: video.share_url,
            type: 'video'
          };
        }
      });
    }

    // Calculate engagement rate
    const reach = totalViews;
    const totalEngagement = totalLikes + totalComments + totalShares;
    const engagementRate = reach > 0 ? (totalEngagement / reach) * 100 : 0;

    // Get previous metrics
    const previousMetrics = await base44.entities.SocialMetric.filter(
      { account_id: accountId, platform: 'TikTok' },
      '-date',
      1
    );

    const previousFollowers = previousMetrics[0]?.followers_gained || followerCount;
    const netFollowerChange = followerCount - previousFollowers;

    // Calculate health score
    const healthScore = Math.min(100, Math.round(
      (engagementRate * 0.3) +
      (reach > 10000 ? 30 : (reach / 10000) * 30) +
      (netFollowerChange > 0 ? 20 : 0) +
      (totalShares > 100 ? 20 : (totalShares / 100) * 20)
    ));

    const healthStatus = healthScore >= 70 ? 'Growing' : healthScore >= 50 ? 'Stable' : 'Needs Attention';

    // Generate insight
    const insight = `${totalViews.toLocaleString()} views with ${engagementRate.toFixed(1)}% engagement rate. ${totalShares > 0 ? `${totalShares} shares amplified reach.` : 'Content performing well.'} ${netFollowerChange > 0 ? `Gained ${netFollowerChange} followers.` : ''}`;

    // Store metrics
    const metricData = {
      client_id: account.client_id,
      account_id: accountId,
      platform: 'TikTok',
      date: new Date().toISOString().split('T')[0],
      reach,
      engagement_rate: engagementRate,
      followers_gained: followerCount,
      followers_lost: 0,
      net_follower_change: netFollowerChange,
      link_clicks: 0,
      profile_visits: 0,
      saves: 0,
      shares: totalShares,
      comments: totalComments,
      likes: totalLikes,
      impressions: totalViews,
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
    console.error('Error syncing TikTok metrics:', error);
    return Response.json({ 
      error: error.message || 'Failed to sync TikTok metrics'
    }, { status: 500 });
  }
});