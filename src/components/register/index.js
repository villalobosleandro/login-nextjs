import React from 'react';

import LoginImg from './../../img/login.svg';
import './../style.scss';

const index = (props) => {
  return (
    <div className="base-container" ref={props.containerRef}>
      <div className="header">Register</div>
        <div className="content">
          <div className="image">
            <img src={LoginImg} alt="login"/>
          </div>

          <div className="form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input type="text" name="username" placeholder="Username"/>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" name="email" placeholder="Email"/>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input type="password" name="password" placeholder="Password"/>
            </div>

          </div>
        </div>

        <div className="footer">
          <button type="button" className="btn">Register</button>
        </div>

    </div>
  );
};

export default index;