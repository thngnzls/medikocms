import React, { useContext, useEffect, useState } from "react";
import Title from "./Title";
import { ShopContext } from "../context/ShopContext";
import ProductItem from "./ProductItem";

const LatestCollection = () => {
  const [latestProducts, setLatestProducts] = useState([]);
  const { products } = useContext(ShopContext); // Accessing products array

  useEffect(() => {
    if (products.length > 0) {
      setLatestProducts(products.slice(0, 10));
    }
  }, [products]);

  return (
    <div className="my-10">
           {" "}
      <div className="text-center py-8 text-3xl">
                <Title text1={"LATEST"} text2={"MEDICAL ESSENTIALS"} />       {" "}
        <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600">
                    Discover the newest medical equipment and daily clinical
          essentials           delivered right to your door.        {" "}
        </p>
             {" "}
      </div>
            {/* Rendering Products */}     {" "}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
               {" "}
        {latestProducts.map((item, index) => (
          <ProductItem
            key={index}
            // 🚨 SPREAD OPERATOR FIX: Pass all properties from the product object
            {...item}
            id={item._id}
          />
        ))}
             {" "}
      </div>
         {" "}
    </div>
  );
};

export default LatestCollection;
