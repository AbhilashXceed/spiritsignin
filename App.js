/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, { Component } from "react";
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  Alert,
  Button,
  NativeModules,
  TouchableOpacity
} from "react-native";
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes
} from "react-native-google-signin";

// import TwitterButton from "./TwitterButton";
import { LoginManager } from "react-native-fbsdk";
import FontAwesome from "react-native-vector-icons/FontAwesome";

const { RNTwitterSignIn } = NativeModules;

const Constants = {
  //Dev Parse keys
  TWITTER_COMSUMER_KEY: "maGhEPSkKzNgUgQHE5vm6uGXw",
  TWITTER_CONSUMER_SECRET: "79PXnp4ErOyl9J026NJa5StRI8zShvol2Uwy4D1EpAmBFn4DuJ"
};

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userInfo: null,
      error: null,
      isLoggedIn: false
    };
  }

  _twitterSignIn = () => {
    RNTwitterSignIn.init(
      Constants.TWITTER_COMSUMER_KEY,
      Constants.TWITTER_CONSUMER_SECRET
    );
    RNTwitterSignIn.logIn()
      .then(loginData => {
        console.warn("logindata:",loginData);
        const { authToken, authTokenSecret, email } = loginData;
        console.warn("email id:", email);
        if (authToken && authTokenSecret) {
          this.setState({
            isLoggedIn: true
          });
        }
      })
      .catch(error => {
        console.log(error);
      });
  };

  handleLogout = () => {
    console.log("logout");
    RNTwitterSignIn.logOut();
    this.setState({
      isLoggedIn: false
    });
  };

  async componentDidMount() {
    this._configureGoogleSignIn();
    await this._getCurrentUser();
  }

  _configureGoogleSignIn() {
    GoogleSignin.configure({
      webClientId:
        "129574031160-qult6ehprvlh51gtarqaa9it767lnu6a.apps.googleusercontent.com",
      offlineAccess: false
    });
  }

  async _getCurrentUser() {
    try {
      const userInfo = await GoogleSignin.signInSilently();
      this.setState({ userInfo, error: null });
    } catch (error) {
      const errorMessage =
        error.code === statusCodes.SIGN_IN_REQUIRED
          ? "Please sign in :)"
          : error.message;
      this.setState({
        error: new Error(errorMessage)
      });
    }
  }

  // facebook login function here

  async loginFacebook() {
    try {
      let result = await LoginManager.logInWithReadPermissions([
        "public_profile"
      ]);
      if (result.isCancelled) {
        alert("Lgin was cancelled");
      } else {
        alert(
          "Login was successful with permissions:" +
            result.grantedPermissions.toString()
        );
      }
    } catch (error) {
      alert("Login failed with error" + error);
    }
  }

  render() {
    const { userInfo } = this.state;
    const { isLoggedIn } = this.state;

    const body = userInfo
      ? this.renderUserInfo(userInfo)
      : this.renderSignInButton();
    return (
      <View style={[styles.container, { flex: 1 }]}>
        <View style={this.props.style}>
          {isLoggedIn ? (
            <TouchableOpacity onPress={this.handleLogout}>
              <Text>Log out</Text>
            </TouchableOpacity>
          ) : (
            <Button
              name="logo-twitter"
              style={styles.button}
              onPress={this._twitterSignIn}
              title="Login with Twitter"
            />
          )}
        </View>
        <FontAwesome.Button
          // style={styles.facebookButtosn}
          name="faebook"
          onPress={this.loginFacebook}
          backgroundColor={"skyblue"}
        >
          <Text style={styles.loginButtonTitle}>Login with Facebook</Text>
        </FontAwesome.Button>
        {this.renderIsSignedIn()}
        {this.renderGetCurrentUser()}
        {this.renderGetTokens()}
        {body}
      </View>
    );
  }

  renderIsSignedIn() {
    return (
      <Button
        onPress={async () => {
          const isSignedIn = await GoogleSignin.isSignedIn();
          Alert.alert(String(isSignedIn));
        }}
        title="is user signed in?"
      />
    );
  }

  renderGetCurrentUser() {
    return (
      <Button
        onPress={async () => {
          const userInfo = await GoogleSignin.getCurrentUser();
          Alert.alert(
            "current user",
            userInfo ? JSON.stringify(userInfo.user) : "null"
          );
        }}
        title="get current user"
      />
    );
  }

  renderGetTokens() {
    return (
      <Button
        onPress={async () => {
          const isSignedIn = await GoogleSignin.getTokens();
          Alert.alert("tokens", JSON.stringify(isSignedIn));
        }}
        title="get tokens"
      />
    );
  }

  renderUserInfo(userInfo) {
    return (
      <View style={styles.container}>
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 20 }}>
          Welcome {userInfo.user.name}
        </Text>
        <Text>Your user info: {JSON.stringify(userInfo.user)}</Text>

        <Button onPress={this._signOut} title="Log out" />
        {this.renderError()}
      </View>
    );
  }

  renderSignInButton() {
    return (
      <View style={styles.container}>
        <GoogleSigninButton
          style={{ width: 212, height: 48 }}
          size={GoogleSigninButton.Size.Standard}
          color={GoogleSigninButton.Color.Auto}
          onPress={this._signIn}
        />
        {this.renderError()}
      </View>
    );
  }

  renderError() {
    const { error } = this.state;
    if (!error) {
      return null;
    }
    const text = `${error.toString()} ${error.code ? error.code : ""}`;
    return <Text>{text}</Text>;
  }

  _signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      this.setState({ userInfo, error: null });
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // sign in was cancelled
        Alert.alert("cancelled");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation in progress already
        Alert.alert("in progress");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("play services not available or outdated");
      } else {
        Alert.alert("Something went wrong", error.toString());
        this.setState({
          error
        });
      }
    }
  };

  _signOut = async () => {
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();

      this.setState({ userInfo: null, error: null });
    } catch (error) {
      this.setState({
        error
      });
    }
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF"
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10
  },
  instructions: {
    textAlign: "center",
    color: "#333333",
    marginBottom: 5
  },
  button: {
    backgroundColor: "#1b95e0",
    color: "white",
    width: 200,
    height: 50
  }
});
