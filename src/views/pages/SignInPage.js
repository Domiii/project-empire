import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  //signInWithGithub,
  signInWithGoogle
  //signInWithTwitter
} from 'src/firebaseUtil';

import { FAIcon } from 'src/views/components/util';

import {
  Alert, Button, Well, Panel
} from 'react-bootstrap';
import LoadIndicator from '../components/util/loading';

class SignInPage extends Component {
  state = {
    busy: false,
    err: null
  };

  /*
    <Button bsStyle="primary" onClick={signInWithGithub}>
      <FAIcon name="github" /> GitHub
    </Button>
    <Button bsStyle="primary" onClick={signInWithTwitter}>
      <FAIcon name="twitter" /> Twitter
    </Button>
  */

  doSignInGoogle = async () => {
    try {
      this.setState({ busy: true });
      await signInWithGoogle();
      this.setState({ busy: false });
    }
    catch (err) {
      console.error(err);
      this.setState({ err, busy: false });
    }
  }

  render() {
    const { busy, err } = this.state;
    return (
      <div className="g-row sign-in">
        <div className="g-col">
          <center>
            <Button bsSize="large" bsStyle="primary" onClick={this.doSignInGoogle}
              disabled={busy}>
              <FAIcon name="google" /> Sign in with Google <LoadIndicator className={!busy && 'invisible'} />
            </Button>
          </center>
        </div>
        {err && <Alert bsStyle="danger">
          {err && err.message || err}
        </Alert>}
      </div>
    );
  }
}

SignInPage.propTypes = {
};


//=====================================
//  CONNECT
//-------------------------------------

export default SignInPage;
