<template>
  <div :class="'q-mb-sm full-width ' + dkli">
    <q-btn no-caps flat :label="$t('FInotif', [$t('gravite' + val)])">
    <q-menu anchor="bottom left" self="top left">
      <q-list style="min-width: 50px">
        <q-item v-for="g in [0, 1, 2 ,3]" :key="g" clickable v-close-popup @click="val=g">
          <notif-ico class="q-mr-sm" :gravite="g" />
          <span class="fs-md text-italic">{{$t('gravite' + g)}}</span>
        </q-item>
      </q-list>
    </q-menu>
    </q-btn>
  </div>
</template>

<script>
import stores from "../stores/stores.mjs"
import { ref, toRef } from 'vue'
import NotifIco from './NotifIco.vue'

export default ({
  name: 'FiltreNotif',

  props: { nom: String, idx: Number },

  components: { NotifIco },

  data () {
    return {
    }
  },

  watch: {
    val (ap) {
      this.st.setFiltre(this.nom, 'notif', ap)
    }
  },

  computed: {
    dkli () { return this.$q.dark.isActive ? (this.idx ? 'sombre' + (this.idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') }
  },

  setup (props) {
    const st = stores.filtre
    const val = ref('')
    const nom = toRef(props, 'nom')
    const x = st.filtre[nom.value]
    val.value = x && x.notif ? x.notif : 0
    return {
      st,
      val
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
