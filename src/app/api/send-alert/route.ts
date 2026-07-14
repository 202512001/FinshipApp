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
              title: `${senderName} is Available! 🔔`,
              body: `Ready to visit someone in ${area}. Tap to respond!`,
            },
            webpush: {
              notification: {
                icon: '/assets/images/app_logo.png',
                vibrate: [200, 100, 200],
                tag: 'community-alert',
                renotify: true,
                requireInteraction: true,
              },
              fcm_options: {
                link: '/',
              },
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json({ success: false, error: err });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false });
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