import React from 'react';

function Footer() {
  return (
    <footer className="image-footer">
      <div className="footer-left">
        <strong>VA INDUSTRIAL</strong> ELECTRICAL SERVICES
      </div>
      <div className="footer-links">
        <a href="#home">HOME</a>
        <a href="#about">ABOUT</a>
        <a href="#privacy">PRIVACY POLICY</a>
      </div>
      <div className="footer-right">
        REACH US: <br />
        <i className="fa-brands fa-facebook"></i> 
        <i className="fa fa-envelope"></i> 
        <i className="fa fa-phone"></i>
      </div>
    </footer>
  );
}

export default Footer;
