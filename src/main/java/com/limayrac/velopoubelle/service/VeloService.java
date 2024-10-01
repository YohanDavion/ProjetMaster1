package com.limayrac.velopoubelle.service;

import com.limayrac.velopoubelle.domain.Velo;
import com.limayrac.velopoubelle.repository.VeloRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class VeloService {

    private final VeloRepository veloRepository;

    public VeloService(VeloRepository veloRepository) {
        this.veloRepository = veloRepository;
    }

    // Ajouter un vélo
    public Velo ajouterVelo(Velo velo) {
        return veloRepository.save(velo);
    }

    // Supprimer un vélo par son ID
    public void supprimerVelo(Long id) {
        veloRepository.deleteById(id);
    }

    // Trouver un vélo par son ID
    public Velo trouverVeloParId(Long id) {
        return veloRepository.findById(id).orElse(null);
    }

    // Récupérer tous les vélos
    public List<Velo> tousLesVelos() {
        return veloRepository.findAll();
    }

    // Récupérer tous les vélos par état
    public List<Velo> velosParEtat(String etat) {
        return veloRepository.findByEtat(etat);
    }

    // Compter le nombre total de vélos
    public long nombreTotalDeVelos() {
        return veloRepository.count();
    }

    // Compter le nombre de vélos par état
    public long nombreDeVelosParEtat(String etat) {
        return veloRepository.countByEtat(etat);
    }
}
