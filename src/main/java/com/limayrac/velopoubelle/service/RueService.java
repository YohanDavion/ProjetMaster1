package com.limayrac.velopoubelle.service;

import com.limayrac.velopoubelle.domain.Rue;
import com.limayrac.velopoubelle.repository.RueRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class RueService {

    @Autowired
    private RueRepository rueRepository;

    public List<Rue> findAll() {
        return rueRepository.findAll();
    }
}
