import { IMG_URL } from "../../config";

const RestaurantCard = ({ name, cuisines, avgRating, cloudinaryImageId }) => {
  return (
    <section className="card">
      <img src={IMG_URL + cloudinaryImageId} alt="sample image" />
      <div className="texts">
        <h2>{name}</h2>
        <p>{cuisines.join(", ")} </p>
        <h4>{avgRating} star</h4>
      </div>
    </section>
  );
};

export default RestaurantCard;
