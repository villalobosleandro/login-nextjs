import React, {useState, useEffect} from 'react';
import { useCookie } from 'next-cookie';
import { useRouter } from 'next/router';

import Login from './login';
import Comet from './../../Comet';

Comet.init({
  host: '192.168.0.109:250',
  ssl: false,
  tokenKey: 'token'
});

const Index = (context) => {
  const cookie = useCookie(context);
  const [token, setToken] = useState('');
  const Router = useRouter();

  useEffect(() => {
    setToken(cookie.get('token'));
  }, [])

  return (
    <div>
      { 
        token !== '' ? Router.push('/Dashboard') : 
        <Login/>
      }
    </div>
    

  );
}

export default Index;
