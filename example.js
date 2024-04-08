const testDiv = document.getElementById("test-div");

async function testGet() {
	get('object', 'public', '#ABN.FX', updateUI);
}

async function testList() {
	list('object', 'private', {'source':'ICE'}, updateUI);
}

function updateUI(data) {
	// const aaa = document.createElement('p');
	testDiv.innerHTML = JSON.stringify(data);
	// testDiv.appendChild(aaa);
}