import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { darkTheme, lightTheme } from "../theme";

const ThemeContext = createContext<any>({});

export const ThemeProvider = ({ children }: any) => {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem("userTheme");
      if (savedTheme !== null) {
        setDark(savedTheme === "dark");
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newDarkValue = !dark;
    setDark(newDarkValue);
    await AsyncStorage.setItem("userTheme", newDarkValue ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider
      value={{ theme: dark ? darkTheme : lightTheme, dark, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
