package com.limayrac.velopoubelle.service;

import com.limayrac.velopoubelle.domain.Arret;
import com.limayrac.velopoubelle.repository.ArretRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ArretService {

    @Autowired
    private ArretRepository arretRepository;

    public List<Arret> getAllArrets() {
        return arretRepository.findAll();
    }
}
