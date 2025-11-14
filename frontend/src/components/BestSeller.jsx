import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";

const BestSeller = () => {
  const [bestSeller, setBestSeller] = useState([]);
  const { products } = useContext(ShopContext);

  useEffect(() => {
    const bestProduct = products.filter((item) => item.bestseller);
    setBestSeller(bestProduct.slice(0, 5));
  }, [products]);

  return (
    <div className="my-10">
           {" "}
      <div className="text-center text-3xl py-8">
                <Title text1={"BEST"} text2={"SELLERS"} />       {" "}
        <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600">
                    Popular, trusted items used by healthcare providers
          nationwide.        {" "}
        </p>
             {" "}
      </div>
           {" "}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
               {" "}
        {bestSeller.map((item, index) => (
          <ProductItem
            key={index}
            // 🚨 SPREAD OPERATOR FIX: Pass all properties from the product object
            {...item}
            id={item._id} // Keep id explicit for clarity/keys
          />
        ))}
             {" "}
      </div>
         {" "}
    </div>
  );
};

export default BestSeller;
