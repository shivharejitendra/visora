import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext(null);

const AppContextProvider = (props) => {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [credits, setCredits] = useState(0);

  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const getAuthHeaders = () =>
    token ? { Authorization: `Bearer ${token}` } : {};

  const loadCreditsData = async () => {
    if (!token) {
      console.log("loadCreditsData: no token, skipping");
      return { success: false, reason: "no-token" };
    }

    try {
      const headers = getAuthHeaders();
      console.log(
        "loadCreditsData -> requesting",
        `${backendUrl}/api/user/credits`,
        headers
      );

      const { data } = await axios.get(
        `${backendUrl}/api/user/credits`,
        { headers }
      );

      console.log("loadCreditsData -> server returned:", data);

      if (!data?.success) {
        if (
          data?.message?.toLowerCase?.().includes("token") ||
          data?.message === "Invalid token"
        ) {
          console.warn("loadCreditsData: token problem:", data.message);
          toast.error(data.message || "Authorization error");
          return { success: false, reason: "auth", payload: data };
        }
        toast.error(data?.message || "Failed to load credits");
        return { success: false, reason: "server-failed", payload: data };
      }

      let serverCredits = null;
      if (typeof data.credits === "number") serverCredits = data.credits;
      else if (typeof data?.data?.credits === "number")
        serverCredits = data.data.credits;
      else if (typeof data?.user?.credits === "number")
        serverCredits = data.user.credits;

      if (serverCredits !== null) setCredits(serverCredits);

      if (data.user) setUser(data.user);
      else if (data.data?.user) setUser(data.data.user);

      return {
        success: true,
        credits: serverCredits ?? null,
        user: data.user ?? data.data?.user ?? null,
      };
    } catch (error) {
      console.error("loadCreditsData error:", error);
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "Something went wrong";
      if (error?.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else {
        toast.error(msg);
      }
      return { success: false, reason: "exception", error };
    }
  };

  const generateImage = async (prompt) => {
    try {
      const headers = getAuthHeaders();
      const { data } = await axios.post(
        `${backendUrl}/api/image/generate-image`,
        { prompt },
        { headers }
      );

      if (data?.success) {
        await loadCreditsData();
        return data.resultImage || null;
      } else {
        toast.error(data?.message || "Image generation failed");
        await loadCreditsData();
        if (data?.credits === 0) {
          navigate("/buy");
        }
        return null;
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Image generation failed"
      );
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    setCredits(0);
  };

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      loadCreditsData();
    } else {
      localStorage.removeItem("token");
      setUser(null);
      setCredits(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, backendUrl]);

  const value = {
    user,
    setUser,
    showLogin,
    setShowLogin,
    backendUrl,
    token,
    setToken,
    credits,
    setCredits,
    loadCreditsData,
    logout,
    generateImage,
  };

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
