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

    if (!account || account.platform !== 'Instagram') {
      return Response.json({ error: 'Invalid Instagram account' }, { status: 404 });
    }

    if (!account.access_token) {
      return Response.json({ error: 'No access token found. Please reconnect this account.' }, { status: 400 });
    }

    // Get Instagram Business Account ID
    const igAccountResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${account.access_token}`
    );
    const igAccountData = await igAccountResponse.json();

    if (!igAccountData.data || igAccountData.data.length === 0) {
      return Response.json({ error: 'No Instagram business account found' }, { status: 404 });
    }

    const pageId = igAccountData.data[0].id;
    const pageAccessToken = igAccountData.data[0].access_token;

    // Get Instagram Account
    const igResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
    );
    const igData = await igResponse.json();

    if (!igData.instagram_business_account) {
      return Response.json({ error: 'No Instagram business account linked' }, { status: 404 });
    }

    const igAccountId = igData.instagram_business_account.id;

    // Fetch Instagram Insights (last 7 days)
    const insightsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}/insights?metric=reach,impressions,profile_views,follower_count&period=day&access_token=${pageAccessToken}`
    );
    const insightsData = await insightsResponse.json();

    // Fetch media insights for engagement
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}/media?fields=like_count,comments_count,timestamp,media_url,permalink&limit=20&access_token=${pageAccessToken}`
    );
    const mediaData = await mediaResponse.json();

    // Calculate metrics
    const reach = insightsData.data?.find(m => m.name === 'reach')?.values[0]?.value || 0;
    const impressions = insightsData.data?.find(m => m.name === 'impressions')?.values[0]?.value || 0;
    const profileViews = insightsData.data?.find(m => m.name === 'profile_views')?.values[0]?.value || 0;
    const followerCount = insightsData.data?.find(m => m.name === 'follower_count')?.values[0]?.value || 0;

    // Calculate engagement from media
    let totalLikes = 0;
    let totalComments = 0;
    let topPost = null;
    let maxEngagement = 0;

    if (mediaData.data) {
      mediaData.data.forEach(post => {
        const likes = post.like_count || 0;
        const comments = post.comments_count || 0;
        const engagement = likes + comments;
        
        totalLikes += likes;
        totalComments += comments;

        if (engagement > maxEngagement) {
          maxEngagement = engagement;
          topPost = {
            url: post.permalink,
            type: 'post'
          };
        }
      });
    }

    const totalEngagement = totalLikes + totalComments;
    const engagementRate = reach > 0 ? (totalEngagement / reach) * 100 : 0;

    // Get previous follower count to calculate net change
    const previousMetrics = await base44.entities.SocialMetric.filter(
      { account_id: accountId, platform: 'Instagram' },
      '-date',
      1
    );

    const previousFollowerCount = previousMetrics[0]?.followers_gained || followerCount;
    const netFollowerChange = followerCount - previousFollowerCount;

    // Calculate health score
    const healthScore = Math.min(100, Math.round(
      (engagementRate * 0.3) +
      (reach > 1000 ? 30 : (reach / 1000) * 30) +
      (netFollowerChange > 0 ? 20 : 0) +
      (profileViews > 100 ? 20 : (profileViews / 100) * 20)
    ));

    const healthStatus = healthScore >= 70 ? 'Growing' : healthScore >= 50 ? 'Stable' : 'Needs Attention';

    // Generate insight
    const insight = `${engagementRate > 3 ? 'Strong' : 'Moderate'} engagement at ${engagementRate.toFixed(1)}%. Reach ${reach > previousMetrics[0]?.reach ? 'increased' : 'decreased'} ${reach > 0 && previousMetrics[0]?.reach ? Math.abs(((reach - previousMetrics[0].reach) / previousMetrics[0].reach * 100)).toFixed(0) : 0}% week-over-week.`;

    // Store metrics
    const metricData = {
      client_id: account.client_id,
      account_id: accountId,
      platform: 'Instagram',
      date: new Date().toISOString().split('T')[0],
      reach,
      engagement_rate: engagementRate,
      followers_gained: followerCount,
      followers_lost: 0,
      net_follower_change: netFollowerChange,
      link_clicks: 0,
      profile_visits: profileViews,
      saves: 0,
      shares: 0,
      comments: totalComments,
      likes: totalLikes,
      impressions,
      top_post_reach: reach,
      top_post_url: topPost?.url,
      top_post_type: topPost?.type,
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
    console.error('Error syncing Instagram metrics:', error);
    return Response.json({ 
      error: error.message || 'Failed to sync Instagram metrics'
    }, { status: 500 });
  }
});