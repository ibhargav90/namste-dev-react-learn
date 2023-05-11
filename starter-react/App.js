    // first: name of the tag
    // second: attr
    // third: what you put inside tag
    const heading1 = React.createElement('h1' , {
        id: 'title1' // all tag attr comes from here
    }, "Namste JS"); 
    const heading2 = React.createElement('h1', {
        id: 'title2' // all tag attr comes from here
    }, "Namste JS2"); 
    const container = React.createElement('div', {
        id: 'container'
    }, [heading1, heading2]);
   
    const root = ReactDOM.createRoot(document.getElementById('root')); // react should know where we need to inject
    root.render(container); // tells browser to put heading into DOM