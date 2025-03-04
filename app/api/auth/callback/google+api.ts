import jwt from "jsonwebtoken";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/callback/google`;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return Response.json(
      { error: "Authorization code is missing" },
      { status: 400 }
    );
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.id_token) {
      throw new Error("Failed to get ID token");
    }

    // Verify ID token by fetching user info directly from Google
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      throw new Error("Failed to get user info");
    }

    const userData = await userInfoResponse.json();
    const user = {
      email: userData.email,
      name: userData.name,
      picture: userData.picture,
    };

    const jwtToken = jwt.sign(user, process.env.JWT_SECRET!, {
      algorithm: "HS256",
      expiresIn: "1h",
    });

    // Get platform from state parameter
    const platform = searchParams.get("state");

    if (platform === "native") {
      // For native apps, use the deep link scheme
      const appRedirectUrl = "com.beto.expoauthjsexample://";
      const redirectUrl = `${appRedirectUrl}?jwtToken=${jwtToken}`;
      return Response.redirect(redirectUrl);
    } else {
      // For all web browsers (desktop and mobile), redirect to the web app URL
      const webRedirectUrl = `${process.env.EXPO_PUBLIC_BASE_URL}/?jwtToken=${jwtToken}`;
      return Response.redirect(webRedirectUrl);
    }
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
