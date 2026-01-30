import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const { clientId } = await req.json();

    // Get all active social media accounts
    const accounts = clientId 
      ? await base44.asServiceRole.entities.SocialMediaAccount.filter({ client_id: clientId, is_active: true })
      : await base44.asServiceRole.entities.SocialMediaAccount.filter({ is_active: true });

    const results = [];
    const errors = [];

    for (const account of accounts) {
      try {
        let response;
        
        switch (account.platform) {
          case 'Instagram':
            response = await base44.asServiceRole.functions.invoke('syncInstagramMetrics', { accountId: account.id });
            break;
          case 'Facebook':
            response = await base44.asServiceRole.functions.invoke('syncFacebookMetrics', { accountId: account.id });
            break;
          case 'YouTube':
            response = await base44.asServiceRole.functions.invoke('syncYouTubeMetrics', { accountId: account.id });
            break;
          case 'TikTok':
            response = await base44.asServiceRole.functions.invoke('syncTikTokMetrics', { accountId: account.id });
            break;
          default:
            errors.push({ accountId: account.id, platform: account.platform, error: 'Unsupported platform' });
            continue;
        }

        results.push({ 
          accountId: account.id, 
          platform: account.platform, 
          success: true 
        });
      } catch (error) {
        errors.push({ 
          accountId: account.id, 
          platform: account.platform, 
          error: error.message 
        });
      }
    }

    return Response.json({ 
      success: true,
      synced: results.length,
      errors: errors.length,
      results,
      errors
    });

  } catch (error) {
    console.error('Error syncing all social metrics:', error);
    return Response.json({ 
      error: error.message || 'Failed to sync social metrics'
    }, { status: 500 });
  }
});