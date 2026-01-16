# Learning notes

## JWT Pizza code study and debugging

As part of `Deliverable ⓵ Development deployment: JWT Pizza`, start up the application and debug through the code until you understand how it works. During the learning process fill out the following required pieces of information in order to demonstrate that you have successfully completed the deliverable.

| User activity                                       | Frontend component | Backend endpoints          | Database SQL       |
| --------------------------------------------------- | ------------------ | -----------------          | ------------       |
| View home page                                      |     Home           | GET /api/order/menu        | SELECT * FROM menu |
| Register new user<br/>(t@jwt.com, pw: test)         |     Register       | POST /api/auth             | INSERT INTO user, userRole    
| Login new user<br/>(t@jwt.com, pw: test)            |     Login          | PUT /api/auth              | SELECT FROM user <br/> SELECT FROM userRole      
| Order pizza                                         |     Payment        | POST /api/order            | INSERT INTO pizzaOrder <br/> INSERT INTO orderItem        
| Verify pizza                                        |     Verify         | GET /api/order/verify      | SELECT FROM pizzaOrder <br/> SELECT FROM orderItem                   
| View profile page                                   |     Profile        | GET /api/order             | SELECT FROM pizzaOrder <br/> SELECT FROM orderItem                   
| View franchise<br/>(as diner)                       |     Franchise      | GET /api/franchise/{id}    | SELECT FROM franchise <br/> SELECT FROM store                   
| Logout                                              |     Header         | DELETE /api/auth           | _none_                   
| View About page                                     |     About.tsx      | _none_                     | _none_                   
| View History page                                   |     history.tsx    | GET /api/order             | SELECT * FROM order WHERE userId = ?                    
| Login as franchisee<br/>(f@jwt.com, pw: franchisee) |     Login          | PUT /api/auth              | SELECT FROM user <br/> SELECT FROM userRole                   
| View franchise<br/>(as franchisee)                  |     franchise.tsx  | GET /api/franchise/:id     | SELECT * FROM franchise WHERE id = ?  SELECT * FROM store WHERE franchiseId = ?                   
| Create a store                                      |     createStore.tsx| POST /api/franchise/1/store| INSERT INTO store (name, franchiseId)                   
| Close a store                                       |     Store.tsx      | DELETE /api/franchise/1/store/2  |    DELETE FROM store WHERE id = ?                
| Login as admin<br/>(a@jwt.com, pw: admin)           |     Login          | PUT /api/auth              | SELECT FROM user <br/> SELECT FROM userRole                   
| View Admin page                                     |     Admin.tsx      | GET /api/franchise?page=0&limit=3&name=*    | SELECT * FROM franchise   SELECT * FROM store                 
| Create a franchise for t@jwt.com                    |     Admin.tsx      | POST /api/franchise        | INSERT INTO franchise (...)                INSERT INTO userRole (...)                   
| Close the franchise for t@jwt.com                   |     Admin.tsx      | DELETE /api/franchise/2    | DELETE FROM franchise WHERE id = ?         DELETE FROM store WHERE franchiseId = ?                   
