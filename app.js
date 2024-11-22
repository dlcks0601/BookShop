// dotenv 모듈 설정
const dotenv = require('dotenv');
dotenv.config();

// express 모듈
const express = require('express');
const cors = require('cors');
const app = express();

// CORS 설정
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// JSON 및 URL-encoded 데이터 파싱
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 포트 설정 및 서버 시작
const PORT = process.env.PORT || 9999;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// 라우터 설정
const userRouter = require('./routes/users');
const bookRouter = require('./routes/books');
const likeRouter = require('./routes/likes');
const cartRouter = require('./routes/carts');
const orderRouter = require('./routes/orders');
const categoryRouter = require('./routes/category');

app.use('/users', userRouter);
app.use('/books', bookRouter);
app.use('/likes', likeRouter);
app.use('/carts', cartRouter);
app.use('/orders', orderRouter);
app.use('/category', categoryRouter);
