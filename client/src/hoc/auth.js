import React, { useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { auth } from "../_actions/user_action";

export default function (SpecificComponent, option, adminRoute = null) {
  //specificComponent = 안에 넣을 컴포넌트

  // option  null = 아무나
  //         true = 로그인한 유저,  false = 로그인 안한 유저

  function AuthenticationCheck(props) {
    const dispatch = useDispatch();

    useEffect(() => {
      dispatch(auth()).then((response) => {
        console.log(response);

        // 로그인 하지 않은 상태
        if (!response.payload.isAuth) {
          if (option) {
            props.history.push("/login");
          }
        } else {
          // 로그인 된 상태
          // admin이 아닌데 admin전용으로 가려할 때
          if (adminRoute && !response.payload.admin) {
            props.history.push("/");
          } else if (option === false) {
            props.history.push("/");
          }
        }
      });
    }, []);

    return <SpecificComponent />;
  }

  return AuthenticationCheck;
}
