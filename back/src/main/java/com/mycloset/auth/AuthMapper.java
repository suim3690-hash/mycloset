package com.mycloset.auth;

import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AuthMapper {
    void insertUser(AppUser user);

    Optional<AppUser> findUserByEmail(String email);

    Optional<AppUser> findUserById(Long id);

    void updateProfile(AppUser user);

    void insertSession(SessionRow session);

    Optional<Long> findUserIdByToken(String token);

    void deleteSession(String token);
}
