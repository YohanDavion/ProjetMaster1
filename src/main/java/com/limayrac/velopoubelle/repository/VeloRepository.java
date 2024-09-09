package com.limayrac.velopoubelle.repository;

import com.limayrac.velopoubelle.domain.Velo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VeloRepository extends JpaRepository<Velo, Long> {}
