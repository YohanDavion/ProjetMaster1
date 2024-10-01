package com.limayrac.velopoubelle.repository;

import com.limayrac.velopoubelle.domain.Velo;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository pour l'entité Velo.
 */
@Repository
public interface VeloRepository extends JpaRepository<Velo, Long> {
    // Trouver tous les vélos par leur état (par exemple "Disponible", "En maintenance")
    List<Velo> findByEtat(String etat);

    // Compter le nombre total de vélos
    long count();

    // Compter le nombre de vélos par état
    long countByEtat(String etat);
}
