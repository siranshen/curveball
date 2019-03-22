var wallWidth = 10.36, wallHeight = 6.84;

var wallVertices = [
	[-wallWidth/2, -wallHeight/2, 2., 1.],
    [-wallWidth/2,  wallHeight/2, 2., 1.],
    [ wallWidth/2,  wallHeight/2, 2., 1.],
    [ wallWidth/2, -wallHeight/2, 2., 1.],
    [-wallWidth/2, -wallHeight/2, -9.1, 1.],
    [-wallWidth/2,  wallHeight/2, -9.1, 1.],
    [ wallWidth/2,  wallHeight/2, -9.1, 1.],
    [ wallWidth/2, -wallHeight/2, -9.1, 1.]
];

function quad(a, b, c, d, v, t, n, buf,tan) {
    buf.vArr.push(v[a]);
    buf.tArr.push(t[1]);
	buf.nArr.push(n);
	buf.tanArr.push(tan);
	
    buf.vArr.push(v[b]);
    buf.tArr.push(t[0]);
	buf.nArr.push(n);
	buf.tanArr.push(tan);

    buf.vArr.push(v[c]);
    buf.tArr.push(t[3]);
	buf.nArr.push(n);
    buf.tanArr.push(tan);
	
    buf.vArr.push(v[a]);
    buf.tArr.push(t[1]);
	buf.nArr.push(n);
	buf.tanArr.push(tan);
	
    buf.vArr.push(v[c]);
    buf.tArr.push(t[3]);
	buf.nArr.push(n);
	buf.tanArr.push(tan);
	
    buf.vArr.push(v[d]);
    buf.tArr.push(t[2]);
	buf.nArr.push(n);
	buf.tanArr.push(tan);
}

function initWallBufs(v, t, buf)
{
    quad(3, 2, 6, 7, v, t, [-1., 0., 0.], buf,[0.,1.,0.]);
    quad(0, 3, 7, 4, v, t, [0., 1., 0.], buf,[1.,0.,0.]);
    quad(2, 1, 5, 6, v, t, [0., -1., 0.], buf,[-1.,0.,0.]);
    quad(1, 0, 4, 5, v, t, [1., 0., 0.], buf,[0.,-1.,0.]);
	buf.vArr = flatten(buf.vArr);
	buf.tArr = flatten(buf.tArr);
	buf.nArr = flatten(buf.nArr);
	buf.tanArr = flatten(buf.tanArr);
}
