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
    let { busy, err } = this.state;
    const iconUrl = 'https://cdn4.iconfinder.com/data/icons/new-google-logo-2015/400/new-google-favicon-512.png';
    
    return (
      <div className="container-fluid position-relative no-padding">
        <div className="page-centered">
          <Button bsSize="large" bsStyle="default" onClick={this.doSignInGoogle}
            disabled={busy}>
            {/* <FAIcon name="google" />&nbsp; */}
            Sign in with <img className="max-size-2" src={iconUrl} />oogle <LoadIndicator className={!busy && 'invisible'} />
          </Button>
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
