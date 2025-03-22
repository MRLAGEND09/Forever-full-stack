import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const bakendUrl = import.meta.env.VITE_BACKEND_URL;
export const ShopContext = createContext();

const ShopProvider = (props) => {
  const currency = "$";
  const delivery_fee = 10;
  const [search, setSearch] = useState("");
  const [showSearch, setshowSearch] = useState(false);
  const [products, setProducts] = useState([]);
  const [token, setToken] = useState("");
  const [cartItems, setCartItems] = useState({});

  const navigate = useNavigate();

  // ----- Add to Cart -----
  const addToCart = async (itemId, size) => {
    if (!size) {
      toast.error("Select Product Size");
      return;
    }

    let cartData = JSON.parse(JSON.stringify(cartItems)); // Safe deep copy

    if (cartData[itemId]) {
      cartData[itemId][size] = (cartData[itemId][size] || 0) + 1;
    } else {
      cartData[itemId] = { [size]: 1 };
    }

    setCartItems(cartData);

    if (token) {
      try {
        await axios.post(`${bakendUrl}/api/cart/add`, { itemId, size }, { headers: { token } });
      } catch (error) {
        console.log(error);
        toast.error(error.message);
      }
    }
  };

  // ----- Get Cart Count -----
  const getCartCount = () => {
    let totalCount = 0;
    for (const items in cartItems) {
      for (const size in cartItems[items]) {
        if (cartItems[items][size] > 0) {
          totalCount += cartItems[items][size];
        }
      }
    }
    return totalCount;
  };

  // ----- Update Quantity -----
  const updateQuantity = async (itemId, size, quantity) => {
    let cartData = JSON.parse(JSON.stringify(cartItems));
    cartData[itemId][size] = quantity;
    setCartItems(cartData);

    if (token) {
      try {
        await axios.post(`${bakendUrl}/api/cart/update`, { itemId, size, quantity }, { headers: { token } });
      } catch (error) {
        console.log(error);
        toast.error(error.message);
      }
    }
  };

  // ----- Get Cart Total Amount -----
  const getCartAmount = () => {
    let totalAmount = 0;
    for (const itemId in cartItems) {
      const itemInfo = products.find((product) => product._id === itemId);
      if (!itemInfo) continue; // Avoid errors if itemInfo is undefined

      for (const size in cartItems[itemId]) {
        if (cartItems[itemId][size] > 0) {
          totalAmount += itemInfo.price * cartItems[itemId][size];
        }
      }
    }
    return totalAmount;
  };

  // ----- Fetch Products Data -----
  const getProductsData = async () => {
    try {
      const response = await axios.get(`${bakendUrl}/api/product/list`);
      if (response.data.success) {
        setProducts(response.data.Products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  // ----- Fetch User Cart Data -----
  const getUserCart = async (userToken) => {
    try {
      const response = await axios.post(`${bakendUrl}/api/cart/get`, {}, { headers: { token: userToken } });
      if (response.data.success) {
        setCartItems(response.data.cartData);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    getProductsData();
  }, []);

  useEffect(() => {
    if (!token && localStorage.getItem("token")) {
      const storedToken = localStorage.getItem("token");
      setToken(storedToken);
      getUserCart(storedToken);
    }
  }, [token]);

  const value = {
    products,
    currency,
    delivery_fee,
    search,
    setSearch,
    showSearch,
    setshowSearch,
    cartItems,
    addToCart,
    setCartItems,
    getCartCount,
    updateQuantity,
    getCartAmount,
    navigate,
    bakendUrl,
    setToken,
    token,
  };

  return <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>;
};

export default ShopProvider;
