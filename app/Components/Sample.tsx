import React, { useState } from "react";
import {
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Sample = () => {
  const handleshare = async () => {
    await Share.share({
      message: "Check out this awesome movie app!",
    });
  };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const handlelogin = async () => {
    if (!email || !password || (!isLogin && !name)) {
      window.alert("please fill all fields");
    }
    if (isLogin) {
      // const res = await api.post("/login", {
      //   email,
      //   password,
      // });
      const res = { email, password };

      console.log(res);
    } else {
      // const res = await api.post("/signup", {
      //   name,
      //   email,
      //   password,
      // });
      const res = { name, email, password };

      console.log(res);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.subcontainer}>
        <Text style={styles.heading}>Login</Text>
        {!isLogin && (
          <View>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.toggleContainer}
              placeholder="jkkklll"
              value={name}
              onChangeText={setName}
            />
          </View>
        )}

        <View>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.toggleContainer}
            placeholder="dfdf"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        <View>
          <label style={styles.label}>Password</label>
          <TextInput
            placeholder="......."
            value={password}
            style={styles.toggleContainer}
            secureTextEntry
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity>
          <Text style={styles.link} onPress={() => setIsLogin(!isLogin)}>
            {isLogin
              ? "Don't have an account? Signup"
              : "Already have an account? Login"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handlelogin}>
          <Text style={styles.btntext}>{isLogin ? "login" : "signup"}</Text>
        </TouchableOpacity>
      </View>

      {/* <TouchableOpacity onPress={() => Linking.openURL("tel:9876543210")}>
        maps
      </TouchableOpacity>
      <a href="https://google.com" rel="noopener noreferrer">
        Open Google
      </a>
      <TouchableOpacity onPress={handleshare}>share</TouchableOpacity> */}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  subcontainer: {
    borderWidth: 1,
    // borderColor:"",
    width: 350,
    height: "60%",
    justifyContent: "space-evenly",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "#e5f6f3",
  },

  toggleContainer: {
    // marginBottom: 10,
    borderWidth: 1,

    borderRadius: 10,
    padding: 8,
    paddingHorizontal: 20,
  },
  heading: {
    fontSize: 30,
    fontWeight: 500,
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#055ee3",
    width: "58%",
    padding: 8,
    flexDirection: "row",
    justifyContent: "center",
    borderRadius: 10,
  },
  btntext: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: 600,
  },
  link: {
    fontSize: 14,
    color: "#0831b6",
  },
});
export default Sample;
