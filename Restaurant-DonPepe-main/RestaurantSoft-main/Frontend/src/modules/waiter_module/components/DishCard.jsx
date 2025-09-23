const DishCard = ({ dish }) => {
  return (
    <>
      <article className="dish-card shadow">
        <h3 className="dish-name">{dish.name}</h3>
        <div>
          <p className="dish-category">{dish.category}</p>
          <p className="dish-price">${dish.price.toFixed(2)}</p>
        </div>
        <span
          className={`dish-availability ${
            dish.available ? "available" : "unavailable"
          }`}
        >
          {dish.available ? "Disponible" : "Agotado"}
        </span>
      </article>
    </>
  );
};

export default DishCard;
