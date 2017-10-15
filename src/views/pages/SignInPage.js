import React, { PropTypes } from 'react';
import {
  //signInWithGithub,
  signInWithGoogle
  //signInWithTwitter
} from 'src/firebaseUtil';

import { FAIcon } from 'src/views/components/util';
import { Button } from 'react-bootstrap';

export function SignInPage({}) {

  { /*
    <Button bsStyle="primary" onClick={signInWithGithub}>
      <FAIcon name="github" /> GitHub
    </Button>
    <Button bsStyle="primary" onClick={signInWithTwitter}>
      <FAIcon name="twitter" /> Twitter
    </Button>
  */ }

  return (
    <div className="g-row sign-in">
      <div className="g-col">
        <center>
          <Button bsSize="large" bsStyle="primary" onClick={signInWithGoogle}>
            <FAIcon name="google" /> Sign in with Google
          </Button>
        </center>
      </div>
    </div>
  );
}

SignInPage.propTypes = {
};


//=====================================
//  CONNECT
//-------------------------------------

export default SignInPage;
