// export SimpleGrid from './SimpleGrid';

// export FAIcon from './FAIcon';

// import React, { Component, PureComponent } from 'react';
// import PropTypes from 'prop-types';
// import { 
//   Grid, Row, Col,
//   Form, FormGroup, FormControl, ControlLabel, FieldArray
// } from 'react-bootstrap';
// import { Field } from 'redux-form';
// // <FieldArray name="members" component={members =>


// export class FormInputFieldBase extends Component {
//   static propTypes = {
//     name: PropTypes.string.isRequired,
//     label: PropTypes.string.isRequired,
//     placeholder: PropTypes.string,
//     labelProps: PropTypes.object,
//     inputColProps: PropTypes.object,
//     inputProps: PropTypes.object
//   };

//   constructor(...args) {
//     super(...args);
//   }

//   createField(component) {
//     let { 
//       name, label, placeholder, labelProps, inputColProps, inputProps
//     } = this.props;

//     return (<FormGroup controlId={name}>
//       <Col componentClass={ControlLabel} {...(labelProps || {})} >
//         {label}
//       </Col>
//       <Col {...(inputColProps || {})}>
//         { component }
//       </Col>
//     </FormGroup>);
//   }
// }

// // see: http://redux-form.com/6.4.3/examples/fieldArrays/
// export class FormInputFieldArray extends FormInputFieldBase {
//   static propTypes = {
//     name: PropTypes.string.isRequired,
//     label: PropTypes.string.isRequired,
//     labelProps: PropTypes.object,
//     inputColProps: PropTypes.object,
//     inputProps: PropTypes.object,
//     component: PropTypes.any
//   };

//   render() {
//     let { 
//       name, inputProps, component
//     } = this.props;

//     const classes = "form-control " + (inputProps && inputProps.className || '');
//     if (inputProps && inputProps.className)
//       delete inputProps.className;

//     return this.createField(<FieldArray className={classes}
//       key={name} id={name} name={name}
//       component={component}
//       {...(inputProps || {})}>
//       {this.props.children}
//     </FieldArray>);
//   }
// }


// export class FormInputField extends FormInputFieldBase {
//   static propTypes = {
//     name: PropTypes.string.isRequired,
//     label: PropTypes.string.isRequired,
//     placeholder: PropTypes.string,
//     labelProps: PropTypes.object,
//     inputColProps: PropTypes.object,
//     inputProps: PropTypes.object,
//     component: PropTypes.any
//   };

//   render() {
//     let { 
//       name, label, placeholder, inputProps, component
//     } = this.props;
//     placeholder = placeholder || label;

//     const classes = "form-control " + (inputProps && inputProps.className || '');
//     if (inputProps && inputProps.className)
//       delete inputProps.className;

//     return this.createField(<Field className={classes}
//       key={name} id={name} name={name} 
//       component={component}
//       label={placeholder}
//       {...(inputProps || {})}>
//       {this.props.children}
//     </Field>);
//   }
// }
