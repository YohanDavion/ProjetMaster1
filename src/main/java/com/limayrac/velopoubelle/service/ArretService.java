package com.limayrac.velopoubelle.service;

import com.limayrac.velopoubelle.domain.Arret;
import com.limayrac.velopoubelle.repository.ArretRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ArretService {

    @Autowired
    private ArretRepository arretRepository;

    public List<Arret> getAllArrets() {
        return arretRepository.findAll();
    }

    public void viderPoubelle(Long id) {
        Optional<Arret> arret = arretRepository.findById(id);
        arret.ifPresent(a -> {
            a.setPoubelleVidee(true);
            arretRepository.save(a);
        });
    }
}
