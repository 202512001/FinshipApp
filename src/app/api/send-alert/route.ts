import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token, senderName, area } = await req.json();

    if (!token) {
      return NextResponse.json({ success: false, message: 'No token' });
    }

    const accessToken = await getAccessToken();

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token,
            notification: {
              title: `🔔 ${senderName} is Available!`,
              body: `Ready to visit someone in ${area}. Tap to respond!`,
            },
            android: {
              priority: 'high',
              notification: {
                channel_id: 'community_alerts',
                notification_priority: 'PRIORITY_MAX',
                sound: 'default',
                default_sound: true,
                default_vibrate_timings: true,
                visibility: 'PUBLIC',
                tag: 'community-alert',
              },
            },
            webpush: {
              headers: {
                Urgency: 'high',
                TTL: '60',
              },
              notification: {
                title: `🔔 ${senderName} is Available!`,
                body: `Ready to visit someone in ${area}. Tap to respond!`,
                icon: '/assets/images/app_logo.png',
                badge: '/assets/images/app_logo.png',
                vibrate: [500, 200, 500, 200, 500],
                tag: 'community-alert',
                renotify: true,
                requireInteraction: true,
              },
              fcm_options: {
                link: 'https://finship-app.vercel.app/member-home',
              },
            },
          },
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({ success: false, error: result });
    }

    return NextResponse.json({ success: true, result });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) });
  }
}

async function getAccessToken(): Promise<string> {
  const { GoogleAuth } = await import('google-auth-library');
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });
  const token = await auth.getAccessToken();
  return token!;
}