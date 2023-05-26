const Logo = () => {
  return (
    <img
      alt="food_villa_logo"
      src="https://upload.wikimedia.org/wikipedia/en/1/12/Swiggy_logo.svg"
    />
  );
};

const NavItems = () => {
  return (
    <ul className="nav-items">
      <li>item 1</li>
      <li>item 2</li>
      <li>item 3</li>
      <li>cart</li>
    </ul>
  );
};

const Header = () => {
  return (
    <div className="header">
      <Logo />
      <NavItems />
    </div>
  );
};


export default Header;