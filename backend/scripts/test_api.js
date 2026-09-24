async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/v1/hospitals?conditionId=fever');
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err.message);
  }
}
test();
