package sportlink.sportlink.project.dto;

import sportlink.sportlink.project.entidades.Cliente;
import sportlink.sportlink.project.entidades.Entrenador;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SesionDto implements Serializable {

    private Integer idSesion;
    private LocalDateTime fechaHora;
    private String estado;
    private Cliente cliente;
    private Entrenador entrenador;

}
