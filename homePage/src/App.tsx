import React from "react";

import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  KeyboardAvoidingView,
  View,
  Platform,
  TouchableOpacity,
  Image,
} from "react-native";

const icon = require("./assets/images/shangpin.jpg");
const appJson = require("../app.json");

function App(): JSX.Element {
  return (
    <SafeAreaView
      style={{
        flex: 1,
      }}
    >
      <StatusBar />
      <View style={{ flex: 1 }}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={{
            flex: 1,
            flexDirection: "column",
          }}
        >
          <View
            style={{
              flex: 1,
              padding: 15,
              backgroundColor: "#00000030",
              borderWidth: 1,
              borderColor: "red",
            }}
          >
            <TextInput
              multiline
              maxLength={200}
              style={{
                width: "100%",
                borderWidth: 1,
                textAlignVertical: "top",
                borderColor: "red",
                height: 300,
              }}
            ></TextInput>
          </View>
        </ScrollView>
      </View>
      <Image
        style={{
          width: 100,
          height: 100,
        }}
        source={icon}
        // source={{
        //   uri: "https://cdn2.jianshu.io/assets/default_avatar/5-33d2da32c552b8be9a0548c7a4576607.jpg",
        //   width: 100,
        //   height: 100,
        // }}
      ></Image>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity>
          <View
            style={{
              width: "100%",
              alignItems: "center",
              height: 50,
              backgroundColor: "red",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#ffffff" }}>
              {appJson.name} : {Number(appJson.version.split(".").join("")) + 1}
            </Text>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
      {/* 滚动视图 */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "400",
  },
  highlight: {
    fontWeight: "700",
  },
});
export default App;
