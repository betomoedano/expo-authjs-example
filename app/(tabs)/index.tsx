import { Image, StyleSheet, Button, Platform, Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useState } from "react";

const AUTH_URL = `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/login`;

WebBrowser.maybeCompleteAuthSession();

export default function HomeScreen() {
  const [token, setToken] = useState<string | null>(null);
  const [publicData, setPublicData] = useState<string | null>(null);
  const [protectedData, setProtectedData] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      // Add platform parameter to AUTH_URL
      const platformParam = Platform.OS === "web" ? "web" : "native";
      const authUrlWithPlatform = `${AUTH_URL}?platform=${platformParam}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrlWithPlatform);

      if (Platform.OS === "android") {
        // For Android, we need to listen to the URL event
        const url = await new Promise<string>((resolve) => {
          const subscription = Linking.addEventListener("url", (event) => {
            subscription.remove();
            resolve(event.url);
          });
        });

        // Parse the deep link URL
        const params = new URLSearchParams(new URL(url).search);
        const jwtToken = params.get("jwtToken");

        if (jwtToken) {
          setToken(jwtToken);
        }
      } else if (result.type === "success" && result.url) {
        // iOS flow remains the same
        const params = new URLSearchParams(new URL(result.url).search);
        const jwtToken = params.get("jwtToken");

        setToken(jwtToken);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const handleGetPublicData = async () => {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_BASE_URL}/api/public/data`
    );
    const data = await response.json();
    setPublicData(data);
  };

  const handleGetProtectedData = async () => {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_BASE_URL}/api/protected/data`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();
    setProtectedData(data);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <Button title="Sign in" onPress={handleSignIn} />
      <Button title="Get public data" onPress={handleGetPublicData} />
      <ThemedText>Public data: {JSON.stringify(publicData)}</ThemedText>
      <Button title="Get protected data" onPress={handleGetProtectedData} />
      <ThemedText>
        Protected data: {JSON.stringify(protectedData, null, 2)}
      </ThemedText>

      {/* <ThemedView style={styles.titleContainer}>
        {session ? (
          <ThemedText>Email: {session.user?.email}</ThemedText>
        ) : (
          <Button title="Sign in" onPress={() => signIn("google")} />
        )}
        {session && <Button title="Sign out" onPress={() => signOut()} />}
      </ThemedView> */}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
