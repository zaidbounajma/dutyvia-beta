// src/components/DutyviaLogo.jsx
import React from "react";
import { View, Image, Text } from "react-native";

export default function DutyviaLogo({ size = 40, showText = true }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Image
        source={require("../../assets/dutyvia-logo.png")}
        style={{
          width: size,
          height: size,
          resizeMode: "contain",
          marginRight: 8,
        }}
      />
      {showText && (
        <Text
          style={{
            fontSize: size * 0.7,
            fontWeight: "700",
            color: "#2563EB", // bleu principal
          }}
        >
          Duty
          <Text
            style={{
              fontWeight: "600",
              color: "#111827", // texte foncé
            }}
          >
            via
          </Text>
        </Text>
      )}
    </View>
  );
}
