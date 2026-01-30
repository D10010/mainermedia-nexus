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

    if (!account || account.platform !== 'Facebook') {
      return Response.json({ error: 'Invalid Facebook account' }, { status: 404 });
    }

    if (!account.access_token) {
      return Response.json({ error: 'No access token found. Please reconnect this account.' }, { status: 400 });
    }

    const pageId = account.account_id;

    // Fetch page insights
    const insightsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/insights?metric=page_impressions,page_engaged_users,page_post_engagements,page_fans,page_views_total&period=day&access_token=${account.access_token}`
    );
    const insightsData = await insightsResponse.json();

    // Fetch recent posts
    const postsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/posts?fields=reactions.summary(true),comments.summary(true),shares,created_time,permalink_url&limit=20&access_token=${account.access_token}`
    );
    const postsData = await postsResponse.json();

    // Calculate metrics
    const impressions = insightsData.data?.find(m => m.name === 'page_impressions')?.values[0]?.value || 0;
    const engagedUsers = insightsData.data?.find(m => m.name === 'page_engaged_users')?.values[0]?.value || 0;
    const postEngagements = insightsData.data?.find(m => m.name === 'page_post_engagements')?.values[0]?.value || 0;
    const pageFans = insightsData.data?.find(m => m.name === 'page_fans')?.values[0]?.value || 0;
    const pageViews = insightsData.data?.find(m => m.name === 'page_views_total')?.values[0]?.value || 0;

    let totalReactions = 0;
    let totalComments = 0;
    let totalShares = 0;
    let topPost = null;
    let maxEngagement = 0;

    if (postsData.data) {
      postsData.data.forEach(post => {
        const reactions = post.reactions?.summary?.total_count || 0;
        const comments = post.comments?.summary?.total_count || 0;
        const shares = post.shares?.count || 0;
        const engagement = reactions + comments + shares;

        totalReactions += reactions;
        totalComments += comments;
        totalShares += shares;

        if (engagement > maxEngagement) {
          maxEngagement = engagement;
          topPost = {
            url: post.permalink_url,
            type: 'post'
          };
        }
      });
    }

    const reach = engagedUsers;
    const totalEngagement = totalReactions + totalComments + totalShares;
    const engagementRate = reach > 0 ? (totalEngagement / reach) * 100 : 0;

    // Get previous metrics
    const previousMetrics = await base44.entities.SocialMetric.filter(
      { account_id: accountId, platform: 'Facebook' },
      '-date',
      1
    );

    const previousFans = previousMetrics[0]?.followers_gained || pageFans;
    const netFansChange = pageFans - previousFans;

    // Calculate health score
    const healthScore = Math.min(100, Math.round(
      (engagementRate * 0.3) +
      (reach > 1000 ? 30 : (reach / 1000) * 30) +
      (netFansChange > 0 ? 20 : 0) +
      (pageViews > 500 ? 20 : (pageViews / 500) * 20)
    ));

    const healthStatus = healthScore >= 70 ? 'Growing' : healthScore >= 50 ? 'Stable' : 'Needs Attention';

    // Generate insight
    const insight = `Reached ${reach.toLocaleString()} users with ${engagementRate.toFixed(1)}% engagement. ${totalShares > 0 ? `${totalShares} shares amplified reach.` : 'Focus on shareable content.'}`;

    // Store metrics
    const metricData = {
      client_id: account.client_id,
      account_id: accountId,
      platform: 'Facebook',
      date: new Date().toISOString().split('T')[0],
      reach,
      engagement_rate: engagementRate,
      followers_gained: pageFans,
      followers_lost: 0,
      net_follower_change: netFansChange,
      link_clicks: 0,
      profile_visits: pageViews,
      saves: 0,
      shares: totalShares,
      comments: totalComments,
      likes: totalReactions,
      impressions,
      top_post_reach: reach,
      top_post_url: topPost?.url,
      top_post_type: 'post',
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
    console.error('Error syncing Facebook metrics:', error);
    return Response.json({ 
      error: error.message || 'Failed to sync Facebook metrics'
    }, { status: 500 });
  }
});