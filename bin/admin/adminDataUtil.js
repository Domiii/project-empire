import process from 'process';

export function fetchData(path) {
  const ref = db.ref(path);
  return ref.once('value')
    .then(snapshot => {
      console.log('value');
      return snapshot.val();
      //console.log('There are ' + size(users) + ' users!');
    })
    .catch(err => {
      console.error('############## ERROR ##############');
      console.error(err.stack);
      process.exit(-1);
    });
}

export function setData(path, data) {
  const ref = db.ref(path);
  return ref.set(data);
}