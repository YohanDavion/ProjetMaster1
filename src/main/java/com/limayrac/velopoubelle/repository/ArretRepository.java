package com.limayrac.velopoubelle.repository;

import com.limayrac.velopoubelle.domain.Arret;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ArretRepository extends JpaRepository<Arret, Long> {}
