const express = require('express');
const {
    order,
    getOrders,
    getOrderDetail,
} = require('../controller/OrderController');
const router = express.Router();
//post 형태로 데이터를 받으려면 json형태로 받게끔 도와주는 모듈
router.use(express.json());
//주문하기
router.post('/', order);
//주문 목록 조회
router.get('/', getOrders);

//주문 상세 상품 조회
router.get('/:id', getOrderDetail);

module.exports = router;
