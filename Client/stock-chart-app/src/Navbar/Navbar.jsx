const Navbar = () => {
    return (
      <nav className="navbar" style={{ border: '1px solid #ddd', marginBottom:'1rem' }}>
        <div className="container-fluid">
          <a className="navbar-brand" href="#">Stock-Chart-App</a>

          <form className="d-flex" role="search">
            <input
              className="form-control me-2"
              type="search"
              placeholder="Search"
              aria-label="Search"
            />
            <button className="btn btn-outline-success" type="submit">
              Search
            </button>
          </form>
        </div>
      </nav>
    );
  };
  
  export default Navbar;
  