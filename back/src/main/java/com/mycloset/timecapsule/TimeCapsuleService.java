package com.mycloset.timecapsule;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class TimeCapsuleService {

    private final TimeCapsuleMapper capsuleMapper;

    public TimeCapsuleService(TimeCapsuleMapper capsuleMapper) {
        this.capsuleMapper = capsuleMapper;
    }

    public TimeCapsule create(LocalDate recordDate, String message, LocalDate revealDate) {
        TimeCapsule capsule = new TimeCapsule();
        capsule.setRecordDate(recordDate);
        capsule.setMessage(message);
        capsule.setRevealDate(revealDate);
        capsuleMapper.insert(capsule);
        return capsule;
    }

    public List<TimeCapsule> findDue() {
        return capsuleMapper.findDue();
    }

    public void markOpened(Long id) {
        capsuleMapper.markOpened(id);
    }
}
