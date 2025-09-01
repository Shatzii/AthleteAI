const request = require('supertest');
const app = require('../../backend/app'); // Adjust the path as necessary
const User = require('../../backend/models/userModel'); // Adjust the path as necessary

describe('User API', () => {
    beforeAll(async () => {
        // Setup code, e.g., connect to the database
    });

    afterAll(async () => {
        // Cleanup code, e.g., disconnect from the database
    });

    it('should create a new user', async () => {
        const newUser = {
            username: 'testuser',
            password: 'testpassword',
            email: 'testuser@example.com'
        };

        const response = await request(app)
            .post('/api/users/register') // Adjust the route as necessary
            .send(newUser);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.username).toBe(newUser.username);
    });

    it('should log in an existing user', async () => {
        const loginUser = {
            username: 'testuser',
            password: 'testpassword'
        };

        const response = await request(app)
            .post('/api/users/login') // Adjust the route as necessary
            .send(loginUser);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
    });

    it('should fetch user profile', async () => {
        const token = 'your_jwt_token_here'; // Replace with a valid token

        const response = await request(app)
            .get('/api/users/profile') // Adjust the route as necessary
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('user');
    });
});