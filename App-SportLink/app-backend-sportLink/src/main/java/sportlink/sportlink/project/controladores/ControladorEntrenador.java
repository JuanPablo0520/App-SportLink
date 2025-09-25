package sportlink.sportlink.project.controladores;

import sportlink.sportlink.project.dto.EntrenadorDto;
import sportlink.sportlink.project.servicios.ServicioEntrenador;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/sportLink/Entrenador")
@CrossOrigin(origins = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
public class ControladorEntrenador {

    private final ServicioEntrenador servicioEntrenador;

    public ControladorEntrenador(ServicioEntrenador servicioEntrenador){
        this.servicioEntrenador = servicioEntrenador;
    }

    @GetMapping("/obtenerTodos")
    public List<EntrenadorDto> obtenerEntrenadores(){
        return servicioEntrenador.obtenerTodos();
    }

    @GetMapping("/obtener/{pkEntrenador}")
    public Optional<EntrenadorDto> obtenerEntrenador(@PathVariable("pkEntrenador")int pkEntrenador){
        return servicioEntrenador.obtenerPorPk(pkEntrenador);
    }

    @PostMapping("/crear")
    @ResponseStatus(HttpStatus.CREATED)
    public EntrenadorDto crear(@RequestBody EntrenadorDto entrenadorDto){
        return servicioEntrenador.crear(entrenadorDto);
    }

    @PutMapping("/actualizar")
    @ResponseStatus(HttpStatus.CREATED)
    public EntrenadorDto actualizar(@RequestBody EntrenadorDto entrenadorDto){
        return servicioEntrenador.actualizar(entrenadorDto);
    }

    @DeleteMapping("/eliminarTodos")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public boolean eliminarTodos(){
        return servicioEntrenador.eliminarTodos();
    }

    @DeleteMapping("/eliminar/{pkEntrenador}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public boolean eliminar(@PathVariable("pkEntrenador") int pkEntrenador){
        return servicioEntrenador.eliminar(pkEntrenador);
    }
}
