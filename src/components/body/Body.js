import { RESTAURANT_LIST } from "../../config";
import RestaurantCard from "./RestaurantCard";
import { useState } from "react";

const filteredData = (searchText, restaurants) => {
  const res = restaurants.filter((restaurant) =>
    restaurant.data.name.toLowerCase().includes(searchText.toLowerCase())
  );
  return res;
};

const Body = () => {
  const [searchText, setSearchText] = useState("");
  const [allRestaurants, setallRestaurants] = useState(RESTAURANT_LIST);
  const [filteredRestuarants, setFilteredRestuarants] = useState(RESTAURANT_LIST);
  return (
    <>
      <div>
        <label htmlFor="site-search">Search the Restaurant Name:</label>
        <input
          type="search"
          id="site-search"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
          }}
        />
        <button
          onClick={() => {
            const data = filteredData(searchText, allRestaurants);
            setFilteredRestuarants(data);
          }}
        >
          Search
        </button>
      </div>
      <main className="restaurant-list">
        {filteredRestuarants.map((res) => {
          return <RestaurantCard {...res.data} key={res.data.id} />;
        })}
      </main>
    </>
  );
};

export default Body;
