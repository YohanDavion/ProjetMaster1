package com.limayrac.velopoubelle.repository;

import com.limayrac.velopoubelle.domain.Incident;
import jakarta.data.repository.Repository;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long> {
    // Méthode pour récupérer les incidents bloqués
    List<Incident> findByBlockedTrue();
}
